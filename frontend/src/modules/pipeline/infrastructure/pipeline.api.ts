import { api } from "../../../shared/lib/axios"
import type {
  Deal,
  CreateDealInput,
  ChangeStageInput,
  PipelineGrouped,
} from "../domain/pipeline.types"

export const pipelineApi = {
  getPipelineBySeller: (sellerId: string): Promise<PipelineGrouped> =>
    api
      .get<PipelineGrouped>(`/pipeline/seller/${sellerId}`)
      .then((r) => r.data),

  getPipelineTeam: (): Promise<PipelineGrouped> =>
    api.get<PipelineGrouped>('/pipeline/team').then((r) => r.data),

  createDeal: (input: CreateDealInput): Promise<Deal> =>
    api.post<Deal>("/pipeline/deals", input).then((r) => r.data),

  changeStage: (dealId: string, input: ChangeStageInput): Promise<Deal> =>
    api.patch<Deal>(`/deals/${dealId}/stage`, input).then((r) => r.data),
}
