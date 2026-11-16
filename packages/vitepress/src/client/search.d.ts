declare module 'virtual:actview-search-index' {
  const indexes: Record<
    string,
    () => Promise<{ default: string }>
  >
  export default indexes
}
