import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Survivor Pool
        </h1>
        <LoginForm />
      </div>
    </div>
  )
}
