import { BasePageProps } from '@/common/type';
import ImageViewer from '@/components/ImageViewer';

export default async function Page(props: BasePageProps) {
  const params = await props.params;
  const { id } = params;

  return (
    <div className="relative mx-auto max-w-screen-2xl">
      <ImageViewer id={id} />
    </div>
  );
}
