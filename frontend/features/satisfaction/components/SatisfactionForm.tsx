"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import type { SatisfactionPayload } from "../models/satisfaction.models";
import { satisfactionDefaults, satisfactionSchema, type SatisfactionValues } from "../schemas/satisfaction.schema";
import styles from "./SatisfactionForm.module.css";

type Props = {
  submitting: boolean;
  onSubmit: (payload: SatisfactionPayload) => Promise<boolean>;
};

export function SatisfactionForm({ submitting, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<SatisfactionValues>({
    resolver: zodResolver(satisfactionSchema),
    defaultValues: satisfactionDefaults
  });

  async function submit(values: SatisfactionValues) {
    await onSubmit({
      overallRating: Number(values.overallRating),
      timelinessRating: Number(values.timelinessRating),
      qualityRating: Number(values.qualityRating),
      wouldRecommend: values.wouldRecommend,
      comments: values.comments
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit(submit)} noValidate>
      <RatingField name="overallRating" label="Satisfacción general" register={register} error={errors.overallRating?.message} />
      <RatingField name="timelinessRating" label="Cumplimiento de tiempos" register={register} error={errors.timelinessRating?.message} />
      <RatingField name="qualityRating" label="Calidad del resultado" register={register} error={errors.qualityRating?.message} />
      <label className="check-field field-wide"><input type="checkbox" {...register("wouldRecommend")} /> Recomendaría este servicio</label>
      <label className="field field-wide"><span>Comentarios</span><textarea maxLength={2000} placeholder="Cuéntenos qué podemos mejorar" aria-invalid={Boolean(errors.comments)} {...register("comments")} />{errors.comments && <small className={styles.error} role="alert">{errors.comments.message}</small>}</label>
      <button className="button field-wide" type="submit" disabled={submitting}><Send size={16} /> {submitting ? "Enviando..." : "Enviar respuesta"}</button>
    </form>
  );
}

function RatingField({ name, label, register, error }: { name: "overallRating" | "timelinessRating" | "qualityRating"; label: string; register: ReturnType<typeof useForm<SatisfactionValues>>["register"]; error?: string }) {
  return (
    <fieldset className={styles.ratingGroup} aria-invalid={Boolean(error)}>
      <legend>{label}</legend>
      <div className={styles.ratingOptions}>
        {[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" value={value} {...register(name)} /><span>{value}</span><small>{value === 1 ? "Muy insatisfecho" : value === 5 ? "Muy satisfecho" : ""}</small></label>)}
      </div>
      {error && <small className={styles.error} role="alert">{error}</small>}
    </fieldset>
  );
}
