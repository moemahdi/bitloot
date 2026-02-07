// Force dynamic rendering — cancel-deletion pages use useParams, useRouter
export const dynamic = 'force-dynamic';

export default function CancelDeletionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
