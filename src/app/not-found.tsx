import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="label">404</p>
        <h1 className="display mt-4 text-[clamp(4rem,18vw,10rem)]">不存在</h1>
        <p className="mt-4 text-ash">這個頁面已被移除或從未存在。</p>
        <Link href="/" className="btn mt-8">
          回到首頁
        </Link>
      </div>
    </div>
  );
}
