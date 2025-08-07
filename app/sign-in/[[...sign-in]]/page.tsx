import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</h1>
          <p className="text-gray-600">Inicia sesión en tu cuenta de PushSaaS</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl border-0',
              card: 'shadow-2xl border-0 rounded-2xl bg-white/80 backdrop-blur-sm',
              headerTitle: 'text-2xl font-bold text-gray-900',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200',
              formFieldInput: 'border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg',
              footerActionLink: 'text-blue-600 hover:text-blue-700 font-semibold',
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
  )
}
