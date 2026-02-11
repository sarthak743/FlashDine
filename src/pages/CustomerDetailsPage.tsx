import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { CustomerDetailsForm } from '@/components/CustomerDetailsForm';
import { useStore } from '@/store/useStore';
import { ArrowLeft } from 'lucide-react';
import { CustomerDetails } from '@/types';

export function CustomerDetailsPage() {
  const navigate = useNavigate();
  const { customerDetails, setCustomerDetails, cart } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) {
    navigate('/menu');
    return null;
  }

  const handleSubmitDetails = async (details: CustomerDetails) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setCustomerDetails(details);
    setIsSubmitting(false);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-zinc-900 pb-20">
      <Header title="Your Details" showTableId={true} />

      {/* Back button */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to cart</span>
        </button>
      </div>

      {/* Form Container */}
      <div className="px-4 py-6 max-w-md mx-auto">
        <CustomerDetailsForm
          onSubmit={handleSubmitDetails}
          initialData={customerDetails || undefined}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
