"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, getUserRole } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

const DEMO_ACCOUNTS = {
  citizen: {
    id: "demo-citizen-01",
    email: "citizen.raghav@kurukshetra.org",
    user_metadata: { full_name: "Raghav Sharma" },
    role: "citizen"
  },
  rescue: {
    id: "demo-rescue-01",
    email: "commander.alpha7@relief.ndrf.gov",
    user_metadata: { full_name: "Capt. Vikram Rao (NDRF Squad)" },
    role: "rescue"
  },
  authority: {
    id: "demo-authority-01",
    email: "dir.operations@disastermgmt.gov",
    user_metadata: { full_name: "Director Ananya Sen (SEOC)" },
    role: "authority"
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_ACCOUNTS.authority); // Defaults to authority for instant preview
  const [role, setRole] = useState("authority");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Listen for Supabase auth state if configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check localStorage for demo session
      const savedUser = localStorage.getItem("kurukshetra_user");
      const savedRole = localStorage.getItem("kurukshetra_role");
      if (savedUser && savedRole) {
        try {
          setUser(JSON.parse(savedUser));
          setRole(savedRole);
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    // Check active session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const userRole = await getUserRole(session.user.id);
        setRole(userRole);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const userRole = await getUserRole(session.user.id);
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Email / Password Login
  const signInWithEmail = async (email, password) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        const userRole = await getUserRole(data.user.id);
        setUser(data.user);
        setRole(userRole);
        router.push("/");
        return { success: true, role: userRole };
      } else {
        // Mock fallback auth
        const detectedRole = email.includes("rescue")
          ? "rescue"
          : email.includes("authority")
          ? "authority"
          : "citizen";

        const mockUser = {
          id: `usr-${Date.now()}`,
          email,
          user_metadata: { full_name: email.split("@")[0] },
          role: detectedRole
        };
        setUser(mockUser);
        setRole(detectedRole);
        localStorage.setItem("kurukshetra_user", JSON.stringify(mockUser));
        localStorage.setItem("kurukshetra_role", detectedRole);
        router.push("/");
        return { success: true, role: detectedRole };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign Up with Email and Role
  const signUpWithEmail = async (email, password, selectedRole, fullName) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole
            }
          }
        });
        if (error) throw error;

        // Insert into public.users table with specified role
        if (data.user) {
          await supabase.from("users").insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role: selectedRole
          });
          setUser(data.user);
          setRole(selectedRole);
          router.push("/");
        }
        return { success: true };
      } else {
        const mockUser = {
          id: `usr-${Date.now()}`,
          email,
          user_metadata: { full_name: fullName },
          role: selectedRole
        };
        setUser(mockUser);
        setRole(selectedRole);
        localStorage.setItem("kurukshetra_user", JSON.stringify(mockUser));
        localStorage.setItem("kurukshetra_role", selectedRole);
        router.push("/");
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined
          }
        });
        if (error) throw error;
      } else {
        // Simulated Google login for review
        const demoGoogleUser = {
          id: "google-usr-99",
          email: "aditya.command@gmail.com",
          user_metadata: { full_name: "Aditya (Verified Google Auth)" },
          role: "authority"
        };
        setUser(demoGoogleUser);
        setRole("authority");
        localStorage.setItem("kurukshetra_user", JSON.stringify(demoGoogleUser));
        localStorage.setItem("kurukshetra_role", "authority");
        router.push("/");
      }
    } catch (err) {
      alert("Google login error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Quick-switch
  const demoLogin = (targetRole) => {
    const account = DEMO_ACCOUNTS[targetRole] || DEMO_ACCOUNTS.citizen;
    setUser(account);
    setRole(targetRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("kurukshetra_user", JSON.stringify(account));
      localStorage.setItem("kurukshetra_role", targetRole);
    }
    router.push("/");
  };

  // Logout
  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kurukshetra_user");
      localStorage.removeItem("kurukshetra_role");
    }
    setLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        demoLogin,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
