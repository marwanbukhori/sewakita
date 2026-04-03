import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const isEn = i18n.language.startsWith('en')

  function switchLang(lang: string) {
    i18n.changeLanguage(lang)
  }

  return (
    <div className="flex items-center gap-0.5 text-xs font-semibold bg-gray-100 rounded-full px-1 py-0.5">
      <button
        onClick={() => switchLang('en')}
        className={`px-1.5 py-0.5 rounded-full transition-colors ${isEn ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
      >EN</button>
      <button
        onClick={() => switchLang('ms')}
        className={`px-1.5 py-0.5 rounded-full transition-colors ${!isEn ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
      >BM</button>
    </div>
  )
}
