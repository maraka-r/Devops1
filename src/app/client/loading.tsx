export default function ClientLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome Section Skeleton */}
      <div className="bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-8 bg-white/30 rounded w-48"></div>
            <div className="h-6 bg-white/20 rounded w-80"></div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 animate-pulse">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mt-2"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 animate-pulse">
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-4 rounded-lg">
                    <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
