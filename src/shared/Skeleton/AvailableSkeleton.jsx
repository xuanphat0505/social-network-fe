import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function AvailableSkeleton({ items }) {
  return (
    <div className="px-6 pb-6">
      <div className="flex gap-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="flex flex-col items-center w-[72px] select-none">
            <Skeleton circle width={48} height={48} />
            <Skeleton width={56} height={10} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvailableSkeleton;
