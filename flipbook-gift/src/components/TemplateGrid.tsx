import Link from "next/link";
import { TEMPLATE_LIST } from "../templates";
import TemplateCover from "./TemplateCover";

export default function TemplateGrid() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
      {TEMPLATE_LIST.map((t) => (
        <li key={t.id}>
          <Link href={`/create?t=${t.id}`} className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2">
            <div className="overflow-hidden rounded-xl shadow-md ring-1 ring-black/5 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
              <TemplateCover template={t} />
            </div>
            <h3 className="mt-3 font-display text-lg font-bold leading-tight text-stone-900">{t.name}</h3>
            <p className="mt-1 text-sm text-stone-600">{t.blurb}</p>
            <span className="mt-2 inline-block text-sm font-bold text-rose-700 group-hover:underline">Use this template →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
