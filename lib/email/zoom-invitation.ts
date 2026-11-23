import { getAppUrl } from "../app-url";
import { renderCorporateEmail } from "./template";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "full",
  timeZone: "UTC",
});

const chileOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Santiago",
  timeZoneName: "longOffset",
});

type ZoomInvitationMeeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  joinUrl: string;
};

function toCalendarTimestamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeCalendarText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/[;,]/g, "\\$&");
}

function foldCalendarLine(line: string) {
  let bytes = 0;
  let folded = "";
  for (const character of line) {
    const size = Buffer.byteLength(character);
    if (bytes + size > 75) {
      folded += "\r\n ";
      bytes = 1;
    }
    folded += character;
    bytes += size;
  }
  return folded;
}

export function buildZoomInvitationEmail(meeting: ZoomInvitationMeeting, appUrl = getAppUrl()) {
  const subject = "Invitación a Zoom · " + meeting.title.replace(/\s+/g, " ").trim();
  const date = dateFormatter.format(new Date(meeting.date + "T00:00:00Z"));
  const localTime = `${meeting.date}T${meeting.time}:00`;
  // SmartPro schedules daytime slots, after any overnight Chilean clock change.
  const zone = chileOffsetFormatter.formatToParts(new Date(localTime + "Z"))
    .find(({ type }) => type === "timeZoneName")!.value;
  const start = new Date(localTime + (zone.slice(3) || "Z"));
  const end = new Date(start.getTime() + meeting.duration * 60_000);
  const description = `Unirse por Zoom: ${meeting.joinUrl}`;
  const googleParams = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates: `${toCalendarTimestamp(start)}/${toCalendarTimestamp(end)}`,
    details: description,
  });
  const outlookParams = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: meeting.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: description,
  });
  const calendarFile = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SmartPro//Reuniones Zoom//ES",
    "BEGIN:VEVENT",
    `UID:${escapeCalendarText(meeting.id)}@smartpro.cl`,
    `DTSTAMP:${toCalendarTimestamp(new Date())}`,
    `DTSTART:${toCalendarTimestamp(start)}`,
    `DTEND:${toCalendarTimestamp(end)}`,
    `SUMMARY:${escapeCalendarText(meeting.title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].map(foldCalendarLine).join("\r\n");

  return {
    subject,
    attachments: [{
      filename: "reunion-smartpro.ics",
      content: Buffer.from(calendarFile, "utf8"),
      contentType: "text/calendar; charset=utf-8",
    }],
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
      linkSection: {
        heading: "Añadir al calendario",
        links: [
          { label: "Google Calendar", href: `https://calendar.google.com/calendar/render?${googleParams}` },
          { label: "Outlook laboral", href: `https://outlook.office.com/calendar/0/deeplink/compose?${outlookParams}` },
          { label: "Outlook personal", href: `https://outlook.live.com/calendar/0/deeplink/compose?${outlookParams}` },
        ],
        note: "Para Apple Calendar u otro calendario compatible, abre el archivo .ics adjunto y guarda la reunión.",
      },
      closing: "Nos vemos pronto.",
    }),
  };
}
