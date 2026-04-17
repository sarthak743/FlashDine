import { useState } from 'react';
import { User, Phone, Mail } from 'lucide-react';
import { CustomerDetails } from '@/types';

interface CustomerDetailsFormProps {
  onSubmit: (details: CustomerDetails) => void;
  initialData?: CustomerDetails;
  isSubmitting?: boolean;
}

export function CustomerDetailsForm({
  onSubmit,
  initialData,
  isSubmitting = false,
}: CustomerDetailsFormProps) {
  const [formData, setFormData] = useState<CustomerDetails>(
    initialData || {
      name: '',
      phone: '',
      email: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
      <h2 className="text-white font-bold text-lg mb-4">Customer Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-2">
            <User className="w-4 h-4 text-orange-400" />
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter your name"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-2">
            <Phone className="w-4 h-4 text-orange-400" />
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Enter 10-digit phone number"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Email Field (Optional) */}
        <div>
          <label className="flex items-center gap-2 text-white font-semibold mb-2">
            <Mail className="w-4 h-4 text-orange-400" />
            Email <span className="text-zinc-400 text-sm font-normal">(Optional)</span>
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed mt-6 shadow-xl shadow-orange-500/30"
        >
          {isSubmitting ? 'Saving...' : 'Continue to Checkout'}
        </button>
      </form>
    </div>
  );
}
