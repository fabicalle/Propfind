'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Mail, Phone, X } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@/store/useAppStore';

interface ContactModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onLoginRedirect?: () => void;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  csrfToken: string;
}

export function ContactModal({ property, isOpen, onClose, isAuthenticated = false, onLoginRedirect }: ContactModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: `Hola, me interesa "${property.title}". ¿Está disponible?`,
    csrfToken: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/csrf')
        .then((res) => res.json())
        .then((data) => setFormData((prev) => ({ ...prev, csrfToken: data.token })))
        .catch(() => {});
    }
  }, [isOpen]);

  const contact = property.contactInfo;
  const whatsappHref = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(formData.message)}`
    : null;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    if (!whatsappHref) return;
    window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    onClose();
  }, [whatsappHref, onClose]);

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': formData.csrfToken,
        },
        body: JSON.stringify({
          propertyId: property.id,
          propertyTitle: property.title,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '', csrfToken: formData.csrfToken });
      } else if (response.status === 429) {
        setSubmitStatus('error');
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [property, formData]);

  const handleClose = useCallback(() => {
    setSubmitStatus('idle');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white border border-border-subtle text-content-primary shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle p-6">
              <div>
                <h2 className="text-xl font-bold text-content-primary">Contactar anunciante</h2>
                <p className="mt-1 text-sm text-content-secondary">{property.title}</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Cerrar"
                className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-app p-2 text-content-secondary outline-none transition-colors hover:bg-border-subtle focus:ring-2 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6">
              {submitStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-content-primary">Mensaje enviado</h3>
                  <p className="mt-2 text-sm text-content-secondary">El anunciante se pondrá en contacto contigo pronto.</p>
                  <button
                    onClick={handleClose}
                    className="mt-6 rounded-xl bg-brand-terracotta px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
                  >
                    Cerrar
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-border-subtle bg-app p-4 text-sm text-content-secondary">
                    Iniciá sesión para contactar al anunciante por WhatsApp o email.
                  </div>

                  <button
                    onClick={onLoginRedirect}
                    className="focus:ring-brand-terracotta/50 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#C86D51] px-6 py-3.5 text-base font-semibold text-white outline-none shadow-sm transition-all hover:bg-[#b05c42] active:scale-[0.98] focus:ring-2 focus:outline-none"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Iniciar sesión con Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-subtle" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-content-secondary">o enviar email sin registro</span>
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Teléfono <span className="font-normal text-content-secondary">(opcional)</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="+54 9 261 123 4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Mensaje
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 resize-none"
                        placeholder="Hola, me interesa esta propiedad..."
                      />
                    </div>

                    {submitStatus === 'error' && (
                      <p className="text-sm text-red-600">Error al enviar el mensaje. Por favor, intentá de nuevo.</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="focus:ring-brand-terracotta/50 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C86D51] px-6 py-3.5 text-base font-semibold text-white outline-none shadow-sm transition-all hover:bg-[#b05c42] active:scale-[0.98] focus:ring-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail className="h-5 w-5" />
                      {isSubmitting ? 'Enviando...' : 'Enviar consulta'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* WhatsApp */}
                  {whatsappHref && (
                    <button
                      onClick={handleWhatsAppClick}
                      className="focus:ring-brand-terracotta/50 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-semibold text-white outline-none shadow-sm transition-all hover:brightness-110 active:scale-[0.98] focus:ring-2 focus:outline-none"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Contactar por WhatsApp
                    </button>
                  )}

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border-subtle" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-content-secondary">o enviar email</span>
                    </div>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="Tu nombre"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Teléfono <span className="font-normal text-content-secondary">(opcional)</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
                        placeholder="+54 9 261 123 4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-content-primary">
                        Mensaje
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full rounded-xl border border-[#E5DFD5] bg-[#F5F2EB] px-4 py-3 text-sm text-content-primary outline-none transition-all placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20 resize-none"
                        placeholder="Hola, me interesa esta propiedad..."
                      />
                    </div>

                    {submitStatus === 'error' && (
                      <p className="text-sm text-red-600">Error al enviar el mensaje. Por favor, intentá de nuevo.</p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="focus:ring-brand-terracotta/50 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C86D51] px-6 py-3.5 text-base font-semibold text-white outline-none shadow-sm transition-all hover:bg-[#b05c42] active:scale-[0.98] focus:ring-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail className="h-5 w-5" />
                      {isSubmitting ? 'Enviando...' : 'Enviar consulta'}
                    </button>
                  </form>
                </div>
              )}

              <p className="mt-4 text-xs text-[#6E675F]">
                Al enviar la consulta, aceptás los{' '}
                <Link href="/terminos" target="_blank" className="underline underline-offset-2 hover:text-content-primary">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/privacidad" target="_blank" className="underline underline-offset-2 hover:text-content-primary">
                  Política de Privacidad
                </Link>{' '}
                de la plataforma.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
