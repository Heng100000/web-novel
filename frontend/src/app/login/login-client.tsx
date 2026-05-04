"use client";

import { useState, useEffect } from "react";
import { LoginForm, IconGoogle, IconFacebook } from "./login-form";
import { IconBooks } from "../dashboard/dashboard-icons";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFBLoggingIn, setIsFBLoggingIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Initialize Facebook SDK
    if (typeof window !== "undefined") {
      (window as any).fbAsyncInit = function() {
        const appId = "2064729153994665";
        console.log("Initializing FB SDK with App ID:", appId);
        
        (window as any).FB.init({
          appId      : appId,
          cookie     : true,
          xfbml      : true,
          version    : 'v18.0',
          status     : false // កែទៅជា false ដើម្បីបំបាត់ Warning ក្នុង Console
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s) as any; js.id = id;
         js.src = "https://connect.facebook.net/en_US/sdk.js";
         fjs.parentNode?.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit', // ប្រើ flow នេះសម្រាប់ទទួលបាន access_token ភ្លាមៗ
    onSuccess: async (tokenResponse) => {
      setIsLoggingIn(true);
      console.log("Google Login Success:", tokenResponse);
      try {
        // បញ្ជូន access_token ទៅកាន់ backend
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/auth/google/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'បរាជ័យក្នុងការចូលតាមរយៈ Google');
        }

        const data = await response.json();
        login(data.access, data.user);
        toast.success("ចូលប្រើប្រាស់ជោគជ័យ!");
        router.push("/");
      } catch (error: any) {
        console.error("Google Login Backend Error:", error);
        toast.error(error.message || "មានបញ្ហាក្នុងការចូលតាមរយៈ Google");
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google Login Popup Error Detail:", errorResponse);
      toast.error("ផ្ទាំង Login ត្រូវបានរារាំង! សូមចុចលើរូបតំណាង 'Popup Blocked' នៅលើរបារអាសយដ្ឋាន (Address Bar) ដើម្បីអនុញ្ញាត។");
    },
  });

  const handleFacebookLogin = () => {
    if (!(window as any).FB) {
      toast.error("Facebook SDK មិនទាន់ទាញយកចប់សព្វគ្រប់។ សូមរង់ចាំបន្តិច!");
      return;
    }

    (window as any).FB.login((fbResponse: any) => {
      if (fbResponse.authResponse) {
        processFacebookLogin(fbResponse.authResponse.accessToken);
      } else {
        toast.error("ការចូលតាមរយៈ Facebook ត្រូវបានបដិសេធ");
      }
    }, { scope: 'public_profile,email' });
  };

  const processFacebookLogin = async (accessToken: string) => {
    setIsFBLoggingIn(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/auth/facebook/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'បរាជ័យក្នុងការចូលតាមរយៈ Facebook');
      }

      const data = await response.json();
      login(data.access, data.user);
      toast.success("ចូលប្រើប្រាស់ជោគជ័យជាមួយ Facebook!");
      router.push("/");
    } catch (error: any) {
      console.error("Facebook Login Error:", error);
      toast.error(error.message || "មានបញ្ហាក្នុងការចូលតាមរយៈ Facebook");
    } finally {
      setIsFBLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full bg-card-bg animate-in fade-in duration-1000">
      {/* ផ្នែកខាងឆ្វេង៖ មាតិកា និងការចូលតាមបណ្តាញសង្គម */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-zinc-900 px-12 lg:flex animate-in fade-in slide-in-from-left duration-1000">
        {/* ធាតុលម្អផ្ទៃខាងក្រោយ */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="animate-float absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#3b6016]/20 blur-[80px] lg:h-96 lg:w-96 lg:blur-[100px]" />
          <div className="animate-float-delayed absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#3b6016]/10 blur-[80px] lg:h-96 lg:w-96 lg:blur-[100px]" />

          {/* ផ្កាយដែលភ្លឺផ្លេកៗ និងធ្វើចលនាអណ្តែត */}
          {isMounted && [...Array(12)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="animate-twinkle absolute rounded-full bg-white"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.2
              }}
            />
          ))}

          {/* សៀវភៅដែលកំពុងហោះហើរ (Magical Floating Books) */}
          {isMounted && [...Array(6)].map((_, i) => (
            <IconBooks
              key={`book-${i}`}
              className="animate-magical-float absolute text-[#3b6016]/20 blur-[1px]"
              style={{
                top: `${15 + Math.random() * 70}%`,
                left: `${10 + Math.random() * 80}%`,
                width: `${30 + Math.random() * 40}px`,
                height: `${30 + Math.random() * 40}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${20 + Math.random() * 15}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
          
          {/* បន្ថែមពន្លឺតូចៗសម្រាប់ភាពទាក់ទាញ */}
          <div className="absolute top-1/4 right-1/4 h-2 w-2 rounded-full bg-[#3b6016]/40 blur-[2px] animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 h-1 w-1 rounded-full bg-[#3b6016]/30 blur-[1px] animate-pulse delay-700" />
        </div>

        <div className="relative z-10 flex w-full max-w-sm flex-col gap-10">
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-4xl font-bold tracking-tight text-white leading-tight">
              សូមស្វាគមន៍ត្រឡប់មកវិញ
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed font-light">
              ចូលប្រើដើម្បីគ្រប់គ្រងបណ្ណាល័យឌីជីថលរបស់អ្នក និងបន្តដំណើរអានដ៏រីករាយ។
            </p>
          </div>

          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <button 
              onClick={() => handleGoogleLogin()}
              disabled={isLoggingIn}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:ring-2 hover:ring-zinc-700/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <IconGoogle className={`size-5 ${isLoggingIn ? 'animate-spin' : ''}`} />
              {isLoggingIn ? 'កំពុងភ្ជាប់...' : 'បន្តជាមួយ Google'}
            </button>
            <button 
              onClick={handleFacebookLogin}
              disabled={isFBLoggingIn}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:ring-2 hover:ring-zinc-700/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <IconFacebook className={`size-5 text-[#1877F2] ${isFBLoggingIn ? 'animate-spin' : ''}`} />
              {isFBLoggingIn ? 'កំពុងភ្ជាប់...' : 'បន្តជាមួយ Facebook'}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            <div className="h-px grow bg-zinc-800" />
            <span>ការអានកម្រិតខ្ពស់</span>
            <div className="h-px grow bg-zinc-800" />
          </div>
        </div>

        {/* ព័ត៌មានខាងក្រោម */}
        <div className="absolute bottom-10 left-12 right-12 z-10 flex items-center justify-between text-xs text-zinc-500 uppercase tracking-widest">
          <p>© ២០២៦ បណ្ណាគារសៀវភៅរឿងរបស់យើង</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-300">ឯកជនភាព</a>
            <a href="#" className="hover:text-zinc-300">លក្ខខណ្ឌ</a>
          </div>
        </div>
      </div>

      {/* ផ្នែកខាងស្តាំ៖ ទម្រង់ការចូល (Login Form) */}
      <div className="flex w-full items-center justify-center px-4 py-6 lg:w-1/2 sm:px-6 lg:px-20 xl:px-32 bg-white lg:py-12 animate-in fade-in slide-in-from-right duration-1000 delay-300 fill-mode-both">
        <div className="flex w-full max-w-xl flex-col gap-8">
          <LoginForm />

          {/* ប៊ូតុងបណ្តាញសង្គមសម្រាប់ទូរស័ព្ទ (ផ្លាស់ទីមកខាងក្រោម) */}
          <div className="flex flex-col gap-4 lg:hidden">
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white px-4 text-zinc-400">ឬបន្តជាមួយ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button 
                onClick={() => handleGoogleLogin()}
                disabled={isLoggingIn}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[10px] font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-95 sm:h-12 sm:gap-3 sm:text-xs disabled:opacity-50"
              >
                <IconGoogle className={`size-4 sm:size-5 ${isLoggingIn ? 'animate-spin' : ''}`} />
                Google
              </button>
              <button 
                onClick={handleFacebookLogin}
                disabled={isFBLoggingIn}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[10px] font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 active:scale-95 sm:h-12 sm:gap-3 sm:text-xs disabled:opacity-50"
              >
                <IconFacebook className={`size-4 sm:size-5 text-[#1877F2] ${isFBLoggingIn ? 'animate-spin' : ''}`} />
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
