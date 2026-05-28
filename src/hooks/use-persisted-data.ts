"use client";

import {
  loadAppointments,
  loadPatients,
  loadProfessionals,
  saveAppointments,
  savePatients,
  saveProfessionals,
} from "@/lib/storage";
import { Appointment, Patient, Professional } from "@/types";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export function usePersistedPatients(fallback: Patient[]) {
  const [data, setData] = useState<Patient[]>(fallback);
  const [isReady, setIsReady] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setData(loadPatients(fallback));
    hasLoadedRef.current = true;
    setIsReady(true);
  }, [fallback]);

  useEffect(() => {
    if (!isReady || !hasLoadedRef.current) return;
    savePatients(data);
  }, [data, isReady]);

  return {
    data,
    setData,
    isReady,
  } as {
    data: Patient[];
    setData: Dispatch<SetStateAction<Patient[]>>;
    isReady: boolean;
  };
}

export function usePersistedAppointments(fallback: Appointment[]) {
  const [data, setData] = useState<Appointment[]>(fallback);
  const [isReady, setIsReady] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setData(loadAppointments(fallback));
    hasLoadedRef.current = true;
    setIsReady(true);
  }, [fallback]);

  useEffect(() => {
    if (!isReady || !hasLoadedRef.current) return;
    saveAppointments(data);
  }, [data, isReady]);

  return {
    data,
    setData,
    isReady,
  } as {
    data: Appointment[];
    setData: Dispatch<SetStateAction<Appointment[]>>;
    isReady: boolean;
  };
}

export function usePersistedProfessionals(fallback: Professional[]) {
  const [data, setData] = useState<Professional[]>(fallback);
  const [isReady, setIsReady] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setData(loadProfessionals(fallback));
    hasLoadedRef.current = true;
    setIsReady(true);
  }, [fallback]);

  useEffect(() => {
    if (!isReady || !hasLoadedRef.current) return;
    saveProfessionals(data);
  }, [data, isReady]);

  return {
    data,
    setData,
    isReady,
  } as {
    data: Professional[];
    setData: Dispatch<SetStateAction<Professional[]>>;
    isReady: boolean;
  };
}
