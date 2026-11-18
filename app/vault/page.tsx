import VaultClient from './VaultClient';
import PasswordCard from './PasswordCard';

export default function VaultPage() {
  return (
    <main>
      <h1>Documents</h1>
      <VaultClient />
      <PasswordCard />
    </main>
  );
}
