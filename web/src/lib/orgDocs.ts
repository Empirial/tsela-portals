import { collection, doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import { useEffect, useMemo, useState } from 'react'
import type { DocKind, FleetDoc } from '../admin/data'
import { db, storage } from './firebase'

export type OrgDoc = { id: string; name: string; uploaded: string; state: FleetDoc['state']; reason?: string }

type Rec = { status: string; reason?: string; uploadedAt?: Timestamp }

const STATE: Record<string, FleetDoc['state']> = { review: 'Pending review', verified: 'Verified', rejected: 'Rejected' }

// The documents a company or mechanic uploaded in the app, live from Firestore. The owner is the only person
// who reviews them: approve / reject writes the new status and opening a file fetches it from Storage.
export function useOrgDocs(orgId: string | undefined, kinds: DocKind[]) {
  const [records, setRecords] = useState<Record<string, Rec>>({})

  useEffect(() => {
    if (!orgId) return
    return onSnapshot(
      collection(db, 'orgs', orgId, 'documents'),
      (snap) => setRecords(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as Rec]))),
      () => {},
    )
  }, [orgId])

  const docs: OrgDoc[] = useMemo(
    () =>
      kinds.map((k) => {
        const r = records[k.id]
        return {
          id: k.id,
          name: k.name,
          state: r ? (STATE[r.status] ?? 'Pending review') : 'Not uploaded',
          reason: r?.reason,
          uploaded: r?.uploadedAt ? r.uploadedAt.toDate().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
        }
      }),
    [records, kinds],
  )

  const review = async (kind: string, status: 'verified' | 'rejected', reason?: string) => {
    if (!orgId) return
    await updateDoc(doc(db, 'orgs', orgId, 'documents', kind), {
      status,
      reason: status === 'rejected' ? (reason ?? '') : '',
      reviewedAt: serverTimestamp(),
    })
  }

  const openDoc = async (kind: string) => {
    if (!orgId) return
    window.open(await getDownloadURL(ref(storage, 'documents/' + orgId + '/' + kind)), '_blank', 'noopener')
  }

  return { docs, review, openDoc }
}
