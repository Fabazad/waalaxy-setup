import { IWorld } from '../../../back/services/profesor/src/entities/World';
import { IWorldTemplate } from '../../../back/services/profesor/src/entities/WorldTemplate';
import { IDraftCampaign } from '../../../back/services/profesor/src/entities/DraftCampaign';

export const getPlanByWorld = (world: IWorld | IWorldTemplate | any) => {
    let isAdvanced = false;
    let isBusiness = false
    let cptActions = 0
    world?.waypoints?.forEach((waypoint: { type: string; }) => {
        if(waypoint.type === "email" || waypoint.type === "enrichment"){
            isBusiness = true
        }
        if(waypoint.type === "webhook"){
            isAdvanced = true
        }
        if(waypoint.type !== "end" && waypoint.type !== "entry" && waypoint.type !== "failed" && waypoint.type !== "goal"){
            cptActions += 1
        }
    })
    if(cptActions > 1){
        isAdvanced = true
    }
    if(isBusiness){
        return "templates.tags.business"
    }
    if(isAdvanced){
        return "templates.tags.advanced"
    }
    return "templates.tags.pro"
}