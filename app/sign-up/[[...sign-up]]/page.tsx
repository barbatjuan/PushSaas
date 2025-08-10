import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#1a1b26] dark:via-[#1f2335] dark:to-[#24283b] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 dark:border-[#414868]/30 p-8 transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-[#7aa2f7] dark:to-[#bb9af7] bg-clip-text text-transparent mb-2">
              Crear Cuenta
            </h1>
            <p className="text-gray-600 dark:text-[#9aa5ce]">
              Únete a NotiFly y comienza a reconectar con tus visitantes
            </p>
          </div>
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-0 dark:bg-[#7aa2f7] dark:hover:bg-[#8fbcf7]',
                card: 'shadow-2xl border-0 rounded-2xl bg-white/80 dark:bg-[#24283b]/90 backdrop-blur-sm',
                headerTitle: 'text-2xl font-bold text-gray-900 dark:text-[#e0e0e0]',
                headerSubtitle: 'text-gray-600 dark:text-[#9aa5ce]',
                socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 dark:border-[#414868]/30 dark:hover:border-[#7aa2f7]',
                formFieldInput: 'border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg dark:border-[#414868]/30 dark:focus:border-[#7aa2f7] dark:focus:ring-[#7aa2f7]',
                footerActionLink: 'text-blue-600 hover:text-blue-700 font-semibold dark:text-[#7aa2f7] dark:hover:text-[#8fbcf7]',
              },
              variables: {
                colorPrimary: '#2563eb',
                colorText: '#1f2937',
                colorTextSecondary: '#6b7280',
              }
            }}
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  )
}
