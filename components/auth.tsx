"use client";

import { useState, useRef, useEffect } from "react";
import { FiMail, FiUser, FiPhone } from "react-icons/fi";
import gsap from "gsap";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

export default function AuthForm() {
  const { setUser } = useAuth();
  const [step, setStep] = useState<"phone" | "code" | "register">("phone");
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    emailAddress: "",
    phoneNumber: "",
    code: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim()) {
      setErrors({ phoneNumber: "Phone number is required" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-code",
          phoneNumber: formData.phoneNumber,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send code");
      showToast.success("Code sent to your phone!");
      setStep("code");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrors({ code: "Code is required" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          phoneNumber: formData.phoneNumber,
          code: formData.code,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Verification failed");

      if (data.data.userExists) {
        localStorage.setItem("token", data.data.token);
        setUser(data.data.user);
        showToast.success("Welcome back! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showToast.success("Phone verified! Please complete registration.");
        setStep("register");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Email is invalid";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phoneNumber: formData.phoneNumber,
          name: formData.name,
          lastName: formData.lastName,
          emailAddress: formData.emailAddress,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Registration failed");

      localStorage.setItem("token", data.data.token);
      setUser(data.data.user);
      showToast.success("Account created! Redirecting...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast.error(message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto mt-20">
        <div
          ref={formRef}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === "register" ? "Complete Profile" : "Welcome"}
            </h1>
            <p className="text-white/60">
              {step === "register"
                ? "Just a few more details"
                : step === "code"
                ? "Enter the code sent to your phone"
                : "Enter your phone number to continue"}
            </p>
          </div>

          <form
            onSubmit={
              step === "phone"
                ? handleSendCode
                : step === "code"
                ? handleVerifyCode
                : handleCompleteRegistration
            }
            className="space-y-6"
          >
            {step === "phone" && (
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  required
                  className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 ${
                    errors.phoneNumber
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/20 focus:border-[#fe9a00]"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-red-400 text-sm">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            )}

            {step === "code" && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                    className={`w-full px-4 py-4 bg-white/5 border rounded-xl text-white text-center text-2xl tracking-widest placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 ${
                      errors.code
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/20 focus:border-[#fe9a00]"
                    }`}
                  />
                  {errors.code && (
                    <p className="mt-1 text-red-400 text-sm text-center">
                      {errors.code}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[#fe9a00] hover:text-orange-300 transition-colors text-sm"
                >
                  Change phone number
                </button>
              </>
            )}

            {step === "register" && (
              <>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    required
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 ${
                      errors.name
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/20 focus:border-[#fe9a00]"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-red-400 text-sm">{errors.name}</p>
                  )}
                </div>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    required
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 ${
                      errors.lastName
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/20 focus:border-[#fe9a00]"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-red-400 text-sm">
                      {errors.lastName}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    required
                    className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 ${
                      errors.emailAddress
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-white/20 focus:border-[#fe9a00]"
                    }`}
                  />
                  {errors.emailAddress && (
                    <p className="mt-1 text-red-400 text-sm">
                      {errors.emailAddress}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#fe9a00] text-white font-semibold rounded-xl hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {step === "phone"
                    ? "Sending Code..."
                    : step === "code"
                    ? "Verifying..."
                    : "Creating Account..."}
                </div>
              ) : step === "phone" ? (
                "Send Code"
              ) : step === "code" ? (
                "Verify Code"
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
