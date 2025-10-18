import React from 'react';

const ServiceAssuranceBanner = ({
  className = '',
  supportStatusDetail = 'We are here to help right now.',
  supportHoursLabel = null
}) => {
  const showSupportHours = Boolean(supportHoursLabel);

  return (
    <section className={` text-[#211923] ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-1 items-center gap-4 sm:gap-5">
          <img
            src="/delivery.png"
            alt="Delivery within 3 Hours"
            className="h-16 w-16 flex-shrink-0 object-contain"
            loading="lazy"
          />
          <div className="flex flex-col">
            <p className="text-base font-semibold uppercase tracking-[0.08em] text-[#1a1a1a] sm:text-lg">
              Delivery within 2 Hours
            </p>
            <p className="mt-1 text-sm text-[#5d4a53]">
              Guaranteed delivery on-time
            </p>
          </div>
        </div>

        <div className="hidden h-12 w-px bg-[#f5c9d0] sm:block" aria-hidden="true" />

        <div className="flex flex-1 items-center gap-4 sm:gap-5">
          <img
            src="/support.png"
            alt="24/7 Customer support"
            className="h-16 w-16 flex-shrink-0 object-contain"
            loading="lazy"
          />
          <div className="flex flex-col">
            <p className="text-base font-semibold uppercase tracking-[0.08em] text-[#1a1a1a] sm:text-lg">
              Customer support
            </p>
            {showSupportHours && (
              <p className="mt-1 text-sm text-[#5d4a53]">
                Support hours: {supportHoursLabel}
              </p>
            )}
            <p className={`text-sm text-[#5d4a53] ${showSupportHours ? 'mt-1.5' : 'mt-1'}`}>
              {supportStatusDetail}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceAssuranceBanner;
