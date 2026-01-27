import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";

type Form = { name: string; email: string; password: string; confirm: string; role?: string };

export default function Register() {
  const { register, handleSubmit } = useForm<Form>({ defaultValues: { role: "Passenger" }});
  const navigate = useNavigate();

  async function onSubmit(values: Form) {
    if (values.password !== values.confirm) {
      alert("Passwords do not match");
      return;
    }
    try {
      await api.post("/auth/register", { name: values.name, email: values.email, password: values.password, role: values.role || "Passenger" });
      alert("Registered — please login");
      navigate("/auth/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Register failed";
      alert(msg);
    }
  }

  return (
    <div className="app-container">
      <div className="card" style={{ position: "relative", overflow: "visible" }}>

        <h2>Create Account</h2>
        <p className="sub">Sign up for your airline account</p>

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 6 }}>
          <label className="label">Full name</label>
          <input {...register("name", { required: true })} className="input" placeholder="NK" />

          <label className="label">Email</label>
          <input {...register("email", { required: true })} className="input" placeholder="you@example.com" />

          <label className="label">Password</label>
          <input {...register("password", { required: true })} className="input" placeholder="At least 6 characters" type="password" />

          <label className="label">Confirm password</label>
          <input {...register("confirm", { required: true })} className="input" placeholder="Confirm password" type="password" />

          <button type="submit" className="btn-primary">Create account</button>

          <div className="helper">
            Already have an account? <Link to="/auth/login" className="link">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
