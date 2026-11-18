import { getAppUrl } from "../app-url";
import { renderCorporateEmail } from "./template";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "full",
  timeZone: "UTC",
});

export function buildZoomInvitationEmail(meeting: {
  title: string;
  date: string;
  time: string;
  duration: number;
  joinUrl: string;
}, appUrl = getAppUrl()) {
  const subject = "Invitación a Zoom · " + meeting.title.replace(/\s+/g, " ").trim();
  const date = dateFormatter.format(new Date(meeting.date + "T00:00:00Z"));

  return {
    subject,
    ...renderCorporateEmail({
      appUrl,
      title: subject,
      preheader: "Consulta el horario y el enlace de tu reunión con SmartPro.",
      heading: "Tu reunión con SmartPro",
      greeting: "Hola,",
      intro: "Te invitamos a participar en una reunión por Zoom.",
      highlight: { label: "Reunión", value: meeting.title },
      details: [
        { label: "Fecha", value: date },
        { label: "Hora de Chile", value: meeting.time },
        { label: "Duración", value: meeting.duration + " minutos" },
      ],
      cta: { href: meeting.joinUrl, label: "Unirse a la reunión" },
      closing: "Nos vemos pronto.",
    }),
  };
}
