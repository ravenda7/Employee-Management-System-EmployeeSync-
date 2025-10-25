import Header from "../_components/header";
import RegisterForm from "../_components/register-form";


export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full m-0 p-0">
      <Header href="/login" label="Login" />
        <div className="flex-1 h-screen w-full bg-black">
          <RegisterForm />
        </div>
    </div>
  )
}