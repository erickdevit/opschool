import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CollapsibleFilterBar, DateField, SelectField } from '../../components';
import { formatDate, parseBrazilDate } from '../../lib/date';
import type { LocalRecord } from '../../types';
import { cleanClassName, extractClassNumber, formatClassDisplayName } from '../classes-model';
import { filterClassesByAttributes, weekDayFilterOptions } from '../class-filter-controls';
import { useEntity } from '../../lib/use-entity';
import type { BiFilters } from './model';

const text = (record: LocalRecord | undefined, field: string) => String(record?.[field] ?? '');

export function BiFilterBar({
  filters,
  onChange,
  courses = [],
  classes = [],
  teachers = [],
  onReset,
}: {
  filters: BiFilters;
  onChange: (next: BiFilters) => void;
  courses?: LocalRecord[];
  classes?: LocalRecord[];
  teachers?: LocalRecord[];
  onReset: () => void;
}) {
  const laboratories = useEntity('laboratories');
  const safeCourses = courses ?? [];
  const safeClasses = classes ?? [];
  const safeTeachers = teachers ?? [];
  const rawAvailableClasses = safeClasses.filter(
    (item) => !filters.courseId || item.course_id === filters.courseId,
  );
  const availableClasses = filterClassesByAttributes(rawAvailableClasses, {
    weekDay: filters.weekDay,
    shift: filters.shift,
    laboratoryId: filters.laboratoryId,
  });

  const updateDate = (field: 'from' | 'to', value: string) => {
    try {
      const parsed = parseBrazilDate(value, { allowFuture: true });
      if (parsed) onChange({ ...filters, [field]: parsed });
    } catch {
      /* DateField keeps the last valid value. */
    }
  };

  return (
    <CollapsibleFilterBar
      title="Filtros do painel de BI"
      storageKey="filter_bi_expanded"
      activeCount={
        (filters.courseId ? 1 : 0) +
        (filters.classId ? 1 : 0) +
        (filters.teacherId ? 1 : 0) +
        (filters.weekDay ? 1 : 0) +
        (filters.shift ? 1 : 0) +
        (filters.laboratoryId ? 1 : 0)
      }
      summary={`${formatDate(filters.from)} a ${formatDate(filters.to)}`}
      className="print:hidden"
      headerActions={
        <button
          type="button"
          onClick={onReset}
          className="h-[32px] px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Restaurar</span>
        </button>
      }
    >
      <div className="flex flex-wrap xl:flex-nowrap items-end gap-2.5">
        <div className="w-full sm:w-36 shrink-0">
          <DateField
            label="Data inicial"
            value={formatDate(filters.from)}
            onChange={(value) => updateDate('from', value)}
            allowFuture
          />
        </div>

        <div className="w-full sm:w-36 shrink-0">
          <DateField
            label="Data final"
            value={formatDate(filters.to)}
            onChange={(value) => updateDate('to', value)}
            allowFuture
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <SelectField
            label="Curso"
            value={filters.courseId ?? ''}
            onChange={(courseId) =>
              onChange({ ...filters, courseId: courseId || undefined, classId: undefined })
            }
            options={[
              { value: '', label: 'Todos os cursos' },
              ...safeCourses
                .filter((item) => !item.deleted_at)
                .map((item) => ({ value: item.id, label: text(item, 'name') })),
            ]}
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <SelectField
            label="Turma"
            value={filters.classId ?? ''}
            onChange={(classId) => onChange({ ...filters, classId: classId || undefined })}
            options={[
              { value: '', label: 'Todas as turmas' },
              ...availableClasses
                .filter((item) => !item.deleted_at)
                .map((item) => {
                  const rawName = text(item, 'name');
                  const num = item.class_number !== undefined && item.class_number !== null
                    ? Number(item.class_number)
                    : extractClassNumber(rawName);
                  const clean = cleanClassName(rawName);
                  return {
                    value: item.id,
                    classNumber: num,
                    label: formatClassDisplayName(num, clean),
                  };
                })
                .sort((a, b) => {
                  const numA = a.classNumber ?? 999999;
                  const numB = b.classNumber ?? 999999;
                  if (numA !== numB) return numA - numB;
                  return a.label.localeCompare(b.label, 'pt-BR');
                }),
            ]}
          />
        </div>

        <div className="w-full sm:w-44 shrink-0">
          <SelectField
            label="Professor"
            value={filters.teacherId ?? ''}
            onChange={(teacherId) => onChange({ ...filters, teacherId: teacherId || undefined })}
            options={[
              { value: '', label: 'Todos os professores' },
              ...safeTeachers.map((item) => ({
                value: item.id,
                label: text(item, 'name') || `Professor ${item.id.slice(0, 8)}`,
              })),
            ]}
          />
        </div>

        <div className="w-full sm:w-32 shrink-0">
          <SelectField
            label="Dia"
            value={filters.weekDay ?? ''}
            onChange={(weekDay) => onChange({ ...filters, weekDay: weekDay || undefined, classId: undefined })}
            options={weekDayFilterOptions}
          />
        </div>

        <div className="w-full sm:w-32 shrink-0">
          <SelectField
            label="Turno"
            value={filters.shift ?? ''}
            onChange={(shift) => onChange({ ...filters, shift: shift || undefined, classId: undefined })}
            options={[
              { value: '', label: 'Todos os turnos' },
              { value: 'manha', label: 'Manhã' },
              { value: 'tarde', label: 'Tarde' },
              { value: 'noite', label: 'Noite' },
            ]}
          />
        </div>

        <div className="w-full sm:w-32 shrink-0">
          <SelectField
            label="Lab"
            value={filters.laboratoryId ?? ''}
            onChange={(labId) => onChange({ ...filters, laboratoryId: labId || undefined, classId: undefined })}
            options={[
              { value: '', label: 'Todos os labs' },
              ...(laboratories.items ?? [])
                .filter((l) => !l.deleted_at && l.active !== 0 && l.active !== false)
                .map((l) => ({ value: String(l.id), label: String(l.name || 'Lab') }))
                .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
            ]}
          />
        </div>
      </div>
    </CollapsibleFilterBar>
  );
}
