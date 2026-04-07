-- ============================================================
-- SewaKita: Seed Test Billing Data
-- ============================================================
-- Run AFTER you have at least 1 property with occupied rooms.
-- This creates utility bills and monthly bills for the last 3 months
-- so you can test reports, charts, and the full billing flow.
--
-- Prerequisites:
--   - At least 1 property with rooms
--   - At least 1 active tenancy (tenant assigned to a room)
--
-- Usage:
--   Paste into Supabase Dashboard > SQL Editor
--   Replace the property_id below with your actual property ID.
-- ============================================================

DO $$
DECLARE
  v_property_id UUID;
  v_room RECORD;
  v_month TEXT;
  v_rent NUMERIC;
  v_electric NUMERIC;
  v_water NUMERIC;
  v_total NUMERIC;
  v_months TEXT[] := ARRAY[
    to_char(now() - interval '3 months', 'YYYY-MM'),
    to_char(now() - interval '2 months', 'YYYY-MM'),
    to_char(now() - interval '1 month', 'YYYY-MM')
  ];
  v_statuses TEXT[] := ARRAY['paid', 'paid', 'pending'];
BEGIN
  -- Get first active property (change this if you have multiple)
  SELECT id INTO v_property_id
  FROM properties
  WHERE is_active = true
  LIMIT 1;

  IF v_property_id IS NULL THEN
    RAISE NOTICE 'No active property found. Create a property first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding billing data for property: %', v_property_id;

  -- Create utility bills for each month
  FOR i IN 1..3 LOOP
    v_month := v_months[i];
    v_electric := 150 + floor(random() * 80);
    v_water := 40 + floor(random() * 30);

    -- Electric
    INSERT INTO utility_bills (property_id, month, type, total_amount, split_method, source)
    VALUES (v_property_id, v_month, 'electric', v_electric, 'equal', 'manual')
    ON CONFLICT DO NOTHING;

    -- Water
    INSERT INTO utility_bills (property_id, month, type, total_amount, split_method, source)
    VALUES (v_property_id, v_month, 'water', v_water, 'equal', 'manual')
    ON CONFLICT DO NOTHING;

    -- Internet (fixed)
    INSERT INTO utility_bills (property_id, month, type, total_amount, split_method, source)
    VALUES (v_property_id, v_month, 'internet', 120, 'equal', 'manual')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created utilities for %: electric=%, water=%', v_month, v_electric, v_water;

    -- Create monthly bills for each occupied room
    FOR v_room IN
      SELECT r.id AS room_id, r.rent_amount, t.tenant_id, t.agreed_rent
      FROM rooms r
      JOIN tenancies t ON t.room_id = r.id AND t.status = 'active'
      WHERE r.property_id = v_property_id AND r.is_active = true
    LOOP
      -- Count occupied rooms for equal split
      v_rent := v_room.agreed_rent;
      SELECT COUNT(*) INTO v_total
      FROM rooms r JOIN tenancies t ON t.room_id = r.id AND t.status = 'active'
      WHERE r.property_id = v_property_id AND r.is_active = true;

      DECLARE
        v_elec_share NUMERIC := round(v_electric / v_total);
        v_water_share NUMERIC := round(v_water / v_total);
        v_internet_share NUMERIC := round(120 / v_total);
        v_bill_total NUMERIC;
        v_paid NUMERIC;
        v_status TEXT := v_statuses[i];
      BEGIN
        v_bill_total := v_rent + v_elec_share + v_water_share + v_internet_share;
        v_paid := CASE WHEN v_status = 'paid' THEN v_bill_total ELSE 0 END;

        INSERT INTO monthly_bills (
          tenant_id, room_id, property_id, month, rent_amount,
          utility_breakdown, total_due, total_paid, status,
          due_date
        ) VALUES (
          v_room.tenant_id, v_room.room_id, v_property_id, v_month, v_rent,
          jsonb_build_array(
            jsonb_build_object('type', 'electric', 'amount', v_elec_share, 'split_method', 'equal'),
            jsonb_build_object('type', 'water', 'amount', v_water_share, 'split_method', 'equal'),
            jsonb_build_object('type', 'internet', 'amount', v_internet_share, 'split_method', 'equal')
          ),
          v_bill_total, v_paid, v_status,
          (v_month || '-15')::date
        ) ON CONFLICT DO NOTHING;

        -- Create payment record if paid
        IF v_status = 'paid' THEN
          INSERT INTO payments (bill_id, amount, date, method, receipt_sent)
          SELECT id, v_bill_total, (v_month || '-15')::date, 'bank_transfer', false
          FROM monthly_bills
          WHERE tenant_id = v_room.tenant_id AND room_id = v_room.room_id AND month = v_month
          LIMIT 1;
        END IF;

        RAISE NOTICE '  % bill for room %: RM% (%)', v_month, v_room.room_id, v_bill_total, v_status;
      END;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Done! 3 months of billing data seeded.';
END $$;
