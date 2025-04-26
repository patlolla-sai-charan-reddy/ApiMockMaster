import { useQuery } from "@tanstack/react-query";

export function useFiles() {
  const { data, isLoading, error, refetch } = useQuery<{ files: string[] }>({
    queryKey: ['/api/files'],
  });

  return {
    files: data?.files || [],
    isLoading,
    error,
    refetch
  };
}
