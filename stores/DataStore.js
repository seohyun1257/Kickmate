// stores/useDateStore.js
import { create } from "zustand";

export const useDataStore = create((set) => ({
  time: "",

  setTimeFromDate: (date) => {
    const h = date.getHours();
    const m = date.getMinutes();

    set({
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    });
  },
}));
