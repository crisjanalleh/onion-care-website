import { useEffect, useState } from "react";
import { getMyContext } from "@/lib/server/accounts";

/** Loads the signed-in visitor plus their OnionCare profile. */
export function useSessionProfile() {
  const [state, setState] = useState({ loading: true, profile: null, user: null, error: null });

  useEffect(() => {
    let active = true;
    getMyContext()
      .then((result) => {
        if (active) setState({ loading: false, profile: result.profile, user: result.user, error: null });
      })
      .catch((error) => {
        if (active) setState({ loading: false, profile: null, user: null, error: error?.message ?? "Unable to load your profile." });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}