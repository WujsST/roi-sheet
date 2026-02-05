import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa klienta jest wymagana').max(100),
  industry: z.string().optional(),
  logo: z.string().max(2, 'Logo może mieć max 2 znaki'),
  automationIds: z.array(z.string().uuid())
})

export const automationSchema = z.object({
  name: z.string().min(1, 'Nazwa automatyzacji jest wymagana').max(100),
  icon: z.string().min(1, 'Wybierz ikonę'),
  hourlyRate: z.number().min(0, 'Stawka musi być >= 0').max(10000),
  workflowId: z.string().min(1, 'Workflow ID jest wymagane'),
  clientIds: z.array(z.string().uuid()).min(1, 'Wybierz przynajmniej jednego klienta'),
  manualTimeMinutes: z.number().min(1, 'Czas manualny musi być > 0').max(480).optional().default(5)
})
