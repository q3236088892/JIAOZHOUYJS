/**
 * Convert tree nodes from API to Ant Design Tree format
 */
export function toAntdTreeData(nodes) {
  if (!nodes) return []
  return nodes.map((n) => ({
    key: n.id,
    title: n.title,
    children: n.children && n.children.length > 0 ? toAntdTreeData(n.children) : [],
    isLeaf: n.node_type === 'leaf',
    data: n
  }))
}

/**
 * Flatten tree to array for searching
 */
export function flattenTree(nodes, result = []) {
  if (!nodes) return result
  for (const node of nodes) {
    result.push(node)
    if (node.children) flattenTree(node.children, result)
  }
  return result
}

/**
 * Find a node in tree by id
 */
export function findNodeInTree(nodes, id) {
  if (!nodes) return null
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Get the path from root to a node
 */
export function getNodePath(nodes, id, path = []) {
  if (!nodes) return null
  for (const node of nodes) {
    const currentPath = [...path, { id: node.id, title: node.title }]
    if (node.id === id) return currentPath
    if (node.children) {
      const found = getNodePath(node.children, id, currentPath)
      if (found) return found
    }
  }
  return null
}

/**
 * Collect all default expanded keys (all branch nodes)
 */
export function collectExpandedKeys(nodes, keys = []) {
  if (!nodes) return keys
  for (const node of nodes) {
    if (node.node_type === 'branch' && node.children && node.children.length > 0) {
      keys.push(node.id)
      collectExpandedKeys(node.children, keys)
    }
  }
  return keys
}
