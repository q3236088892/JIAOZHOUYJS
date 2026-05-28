export function buildLeftMenuFromStages(stages = []) {
  return stages.map((stage) => ({
    stageKey: stage.stage_key,
    stageTitle: stage.stage_title,
    categories: (stage.categories || []).map((category) => ({
      categoryKey: category.category_key,
      categoryTitle: category.category_title,
      items: (category.topics || []).map((topic) => ({
        topicId: topic.id,
        anchorKey: topic.anchor_key,
        title: topic.title
      }))
    }))
  }))
}
