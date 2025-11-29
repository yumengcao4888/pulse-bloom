'use client';

import { useState, FormEvent } from 'react';

type PractitionerForm = {
  name: string;
  pronouns: string;
  modality: string;
  focus: string;
  city: string;
  contact: string;
  bio: string;
};

const initialForm: PractitionerForm = {
  name: '',
  pronouns: '',
  modality: '',
  focus: '',
  city: '',
  contact: '',
  bio: '',
};

export default function PractitionerForm() {
  const [form, setForm] = useState<PractitionerForm>(initialForm);

  const handleChange =
    (field: keyof PractitionerForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/practitioner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const data = await res.json();
      console.log("Saved practitioner:", data);

      alert("Saved to backend SQLite database successfully!");
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium">What name should we use?</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. Alex, Luna, Dr. Rivera"
          value={form.name}
          onChange={handleChange('name')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Pronouns you&apos;d like us to use <span className="text-gray-500 text-sm">(optional)</span>
        </label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. she/her, they/them, he/him, xe/xem, or however you identify"
          value={form.pronouns}
          onChange={handleChange('pronouns')}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Primary care approach / modality</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. yoga, community acupuncture, peer support"
          value={form.modality}
          onChange={handleChange('modality')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Who do you center in your work?</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. queer & trans folks, BIPOC parents, immigrants"
          value={form.focus}
          onChange={handleChange('focus')}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Where are you based? (optional)</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="e.g. online / based in Chicago, IL"
          value={form.city}
          onChange={handleChange('city')}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">
            How can people reach you? <span className="text-gray-500 text-sm">(optional)</span>
        </label>

        <div className="flex flex-wrap gap-2 text-sm">
            {['Email', 'Phone', 'Website', 'IG / Social', 'Other'].map((type) => (
            <button
                type="button"
                key={type}
                className="rounded-full border px-3 py-1 hover:bg-gray-100"
                onClick={() => setForm({ ...form, contact: `${type}: ` })}
            >
                {type}
            </button>
            ))}
        </div>

        <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
            placeholder="Feel free to include one or more ways, each on a new line if you'd like."
            value={form.contact}
            onChange={handleChange('contact')}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium">Tell us a little about your practice</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[100px]"
          placeholder="Share anything you'd like - your background, care values, or current offerings."
          value={form.bio}
          onChange={handleChange('bio')}
          required
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => setForm(initialForm)}
        >
          Reset
        </button>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Save
        </button>
      </div>
    </form>
  );
}