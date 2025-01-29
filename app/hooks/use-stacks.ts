import {
  AppConfig,
  showConnect,
  UserData,
  UserSession,
} from "@stacks/connect";
import { useEffect, useState, useMemo } from "react";

export function useStacks() {
  const [userData, setUserData] = useState<UserData | null>(null);

  const userSession = useMemo(() => {
    const appConfig = new AppConfig(["store_write"]);
    return new UserSession({ appConfig });
  }, []);

  function connectWallet() {
    try {
      if (userSession.isUserSignedIn()) {
        console.log("User already signed in");
        setUserData(userSession.loadUserData());
        return;
      }

      showConnect({
        appDetails: {
          name: "Stacks Account Hist",
          icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
        },
        onFinish: () => {
          try {
            // ✅ Reload only if window exists to avoid SSR issues
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          } catch (err) {
            console.error("Error reloading:", err);
          }
        },
        userSession,
      });
    } catch (err) {
      console.error("LoginFailedError:", err);

      // ✅ If decryption fails, sign out and reset session
      if (err instanceof Error && err.message.includes("Failed decrypting appPrivateKey")) {
        userSession.signUserOut();
        setUserData(null);
        console.log("Session reset due to decryption error. Please try logging in again.");
      }
    }
  }

  function disconnectWallet() {
    userSession.signUserOut();
    setUserData(null);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (userSession.isUserSignedIn()) {
        setUserData(userSession.loadUserData());
      } else if (userSession.isSignInPending()) {
        userSession.handlePendingSignIn().then((userData) => {
          setUserData(userData);
        }).catch((err) => {
          console.error("Error handling pending sign-in:", err);
        });
      }
    }
  }, [userSession]);

  return { userData, connectWallet, disconnectWallet };
}
