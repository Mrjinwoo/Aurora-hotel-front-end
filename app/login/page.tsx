import { Suspense } from "react";
import LoginPage from "./login";

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-28 text-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
