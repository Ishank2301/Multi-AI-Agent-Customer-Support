
import { useEffect } from "react";
import { useRouter } from "next/router";
import { authAPI } from "../services/api";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (authAPI.isLoggedIn()) {
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, []);

  return null;
}
