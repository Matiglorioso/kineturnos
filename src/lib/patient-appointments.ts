import { getAppointmentDateTime } from "@/lib/date-utils";
import { Appointment } from "@/types";

export { getAppointmentDateTime };

export function getPatientAppointments(
  appointments: Appointment[],
  patientId: string
): Appointment[] {
  return appointments.filter((appointment) => appointment.patientId === patientId);
}

export function countPatientAppointments(
  appointments: Appointment[],
  patientId: string
): number {
  return getPatientAppointments(appointments, patientId).length;
}

export function removePatientAppointments(
  appointments: Appointment[],
  patientId: string
): Appointment[] {
  return appointments.filter((appointment) => appointment.patientId !== patientId);
}

export function splitPatientAppointments(
  appointments: Appointment[],
  patientId: string,
  referenceDate: Date = new Date()
): { upcoming: Appointment[]; past: Appointment[] } {
  const patientAppointments = getPatientAppointments(appointments, patientId);

  const upcoming: Appointment[] = [];
  const past: Appointment[] = [];

  patientAppointments.forEach((appointment) => {
    const appointmentDate = getAppointmentDateTime(
      appointment.date,
      appointment.time
    );

    if (appointmentDate >= referenceDate) {
      upcoming.push(appointment);
    } else {
      past.push(appointment);
    }
  });

  upcoming.sort(
    (a, b) =>
      getAppointmentDateTime(a.date, a.time).getTime() -
      getAppointmentDateTime(b.date, b.time).getTime()
  );

  past.sort(
    (a, b) =>
      getAppointmentDateTime(b.date, b.time).getTime() -
      getAppointmentDateTime(a.date, a.time).getTime()
  );

  return { upcoming, past };
}
