'use client';

import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { User } from 'lucide-react';
import { Home } from 'lucide-react';

interface SellerStepperProps {
  currentPhase: 'contact' | 'form';
}

export function SellerStepper({ currentPhase }: SellerStepperProps) {
  const steps = [
    { key: 'contact', label: 'Datos de contacto', Icon: User },
    { key: 'form', label: 'Publicar propiedad', Icon: Home },
  ] as const;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isActive = step.key === currentPhase;
        const isCompleted = steps.findIndex((s) => s.key === currentPhase) > index;

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  isCompleted
                    ? 'border-brand-terracotta bg-brand-terracotta text-white'
                    : isActive
                       ? 'border-content-primary bg-brand-olive text-white'
                      : 'border-border-subtle bg-app text-content-secondary'
                }`}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(255,255,255,0.3)',
                          '0 0 0 10px rgba(255,255,255,0)',
                          '0 0 0 0 rgba(255,255,255,0)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <step.Icon className="h-4 w-4" />
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  isActive || isCompleted ? 'text-content-primary' : 'text-content-secondary'
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="relative mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-terracotta"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: motionTokens.easing.natural }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
