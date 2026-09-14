export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EB] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-[#E5DFD5] bg-white p-8">
        <h1 className="text-2xl font-bold text-[#231F1D]">Términos y Condiciones de Uso</h1>
        <p className="mt-1 text-sm text-[#6E675F]">Última actualización: Septiembre 2026</p>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#231F1D]">
          <p>
            Bienvenido a Propfind. Al acceder o utilizar nuestro sitio web y servicios, aceptás cumplir y estar sujeto a los siguientes Términos y Condiciones.
          </p>

          <h2 className="text-lg font-semibold">1. Naturaleza del Servicio</h2>
          <p>
            Propfind es un portal de comunicación y difusión que conecta a personas interesadas en alquilar o comprar inmuebles con propietarios, corredores e inmobiliarias. Propfind no es una agencia inmobiliaria, no es dueña de las propiedades publicadas y no participa en las transacciones de compraventa o alquiler.
          </p>

          <h2 className="text-lg font-semibold">2. Exención de Responsabilidad sobre las Publicaciones</h2>
          <p>
            La información, fotos, precios, características y disponibilidad de los inmuebles son proporcionados exclusivamente por los anunciantes. Propfind no garantiza la veracidad, exactitud o vigencia de dichas publicaciones. Cualquier acuerdo, seña o contrato se realiza exclusivamente entre el usuario y el anunciante.
          </p>

          <h2 className="text-lg font-semibold">3. Uso Aceptable</h2>
          <p>
            El usuario se compromete a no utilizar la plataforma para realizar consultas falsas, enviar spam, intentar vulnerar la seguridad del sistema o extraer datos de forma masiva (scraping) sin autorización previa.
          </p>

          <h2 className="text-lg font-semibold">4. Modificaciones del Servicio</h2>
          <p>
            Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de la plataforma en cualquier momento sin previo aviso.
          </p>
        </div>
      </div>
    </div>
  );
}
