import RotatingText from "@/components/react-bits-components/RotatingText";
import Header from "../_components/header";
import LoginForm from "../_components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full m-0 p-0">
      <Header href="/register" label="Register" />
      <div className="flex">
        <div className="flex-1 h-screen w-full bg-gray-950 border-r-[1px] border-gray-600 hidden lg:flex flex-col items-center justify-center gap-y-4">
          <div className="flex items-center gap-x-2 text-4xl">
            <h1 className="text-white font-bold font-title">Manage Your</h1>
            <RotatingText
              texts={['Employees', 'Attendace', 'Payroll', 'Shifts','Departments','Leave Requests','Performance']}
              mainClassName="px-2 sm:px-2 md:px-3 bg-purple-700 text-white font-title font-bold overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </div>
            <p className="text-xl font-semibold text-slate-500 w-[60%] text-center">
              Empower your business to handle employee management smarter and faster.
            </p>
        </div>
        <div className="flex-1 h-screen w-full bg-black">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}