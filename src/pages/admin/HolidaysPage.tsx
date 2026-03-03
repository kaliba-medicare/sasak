import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

interface Holiday {
  id: string;
  name: string;
  date: string;
  created_at?: string;
}

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ name: "", date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat mengambil daftar libur.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleOpenModal = () => {
    setFormData({ name: "", date: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date) {
      toast({
        title: "Data tidak lengkap",
        description: "Harap isi nama event dan tanggal libur.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await (supabase as any)
        .from('holidays')
        .insert([{ name: formData.name, date: formData.date }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('Tanggal libur ini sudah terdaftar.');
        }
        throw error;
      }

      toast({
        title: "Berhasil",
        description: "Hari libur berhasil ditambahkan.",
      });
      setIsModalOpen(false);
      fetchHolidays();
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan",
        description: error.message || "Terjadi kesalahan sistem.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus libur "${name}"?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Hari libur berhasil dihapus.",
      });
      fetchHolidays();
    } catch (error) {
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus data.",
        variant: "destructive"
      });
    }
  };

  const formatDateLabel = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kelola Hari Libur & Event</h1>
          <p className="text-muted-foreground">
            Atur tanggal merah, cuti bersama, atau hari libur lainnya. Waktu ini tidak akan dihitung sebagai persentase kehadiran pegawai.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Tambah Libur
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-muted/30">
          <CardTitle>Daftar Hari Libur</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">No</TableHead>
                  <TableHead>Nama Event</TableHead>
                  <TableHead>Tanggal Libur</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada pendaftaran hari libur
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday, index) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{holiday.name}</TableCell>
                      <TableCell>{formatDateLabel(holiday.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(holiday.id, holiday.name)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Hari Libur Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Event / Libur</label>
              <Input
                placeholder="Contoh: Hari Raya Idul Fitri"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Libur</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Libur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HolidaysPage;
