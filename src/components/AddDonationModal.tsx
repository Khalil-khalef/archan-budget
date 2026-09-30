"use client";

import { useRef, useState, useTransition } from "react";
import Modal from "./Modal";
import { addDonationAction } from "@/app/actions";

export default function AddDonationModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = Number(amount) > 0;

  const save = () => {
    if (!isValid) return;
    const formData = new FormData();
    formData.set("montant", amount);
    startTransition(async () => {
      await addDonationAction(formData);
      onClose();
    });
  };

  return (
    <Modal
      title="إضافة تبرع"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-row-hover"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isValid || isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-45"
          >
            حفظ
          </button>
        </>
      }
    >
      <label className="mb-1 block text-sm text-text-secondary">
        المبلغ (MRO)
      </label>
      <input
        ref={inputRef}
        autoFocus
        type="number"
        step="any"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="w-full rounded-lg border border-border px-3 py-3 text-xl tabular-nums focus:border-primary focus:outline-none"
      />
    </Modal>
  );
}
