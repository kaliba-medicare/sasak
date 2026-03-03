import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

interface EmployeeModalProps {
  employee?: any;
  onSuccess: () => void;
  children: React.ReactNode;
}

const EmployeeModal = ({ employee, onSuccess, children }: EmployeeModalProps) => {
  const [name, setName] = useState(employee?.name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [password, setPassword] = useState("");
  const [nip, setNip] = useState(employee?.nip || "");
  const [position, setPosition] = useState(employee?.position || "");
  const [department, setDepartment] = useState(employee?.department || "");
  const [role, setRole] = useState(employee?.role || "employee");
  const [employeeId, setEmployeeId] = useState(employee?.employee_id || "");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setName(employee.name || "");
      setEmail(employee.email || "");
      setNip(employee.nip || "");
      setPosition(employee.position || "");
      setDepartment(employee.department || "");
      setRole(employee.role || "employee");
      setEmployeeId(employee.employee_id || "");
    }
  }, [employee, open]);

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `EMP${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        // Update employee
        const { data: updatedData, error } = await supabase.from("profiles").update({
          name,
          employee_id: employeeId,
          nip,
          position,
          department,
          role,
        }).eq("id", employee.id).select();
        
        if (error) throw error;
        if (!updatedData || updatedData.length === 0) {
          throw new Error("Gagal memperbarui data. Pastikan Anda memiliki akses Admin.");
        }
        toast({ title: "Berhasil", description: "Data pegawai berhasil diperbarui" });
      } else {
        // Create new employee using isolated signup to prevent admin logout
        const finalEmployeeId = employeeId || generateEmployeeId();
        
        const isolatedSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        );

        // First create the user account using isolated client
        const { data: authData, error: authError } = await isolatedSupabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              name: name,
              employee_id: finalEmployeeId,
              nip: nip,
              position: position,
              department: department,
              role: role
            }
          }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          // Update the profile that was created by the trigger with additional info
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: name,
              employee_id: finalEmployeeId,
              nip: nip,
              position: position,
              department: department,
              role: role
            })
            .eq('user_id', authData.user.id);
          
          if (profileError) throw profileError;
        }
        
        toast({ title: "Berhasil", description: "Pegawai baru berhasil ditambahkan" });
      }
      
      // Reset form
      if (!employee) {
        setName("");
        setEmail("");
        setPassword("");
        setNip("");
        setPosition("");
        setDepartment("");
        setEmployeeId("");
        setRole("employee");
      }
      
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">ID Pegawai</Label>
            <Input 
              id="employeeId" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              placeholder={employee ? "" : "Kosongkan untuk generate otomatis"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nip">NIP (Opsional)</Label>
            <Input id="nip" value={nip} onChange={(e) => setNip(e.target.value)} />
          </div>
          {!employee && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="position">Jabatan</Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Bidang</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Bidang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bidang Pelayanan Elektronik Government">Bidang Pelayanan Elektronik Government</SelectItem>
                <SelectItem value="Bidang Pengelolaan Informasi dan Komunikasi Publik">Bidang Pengelolaan Informasi dan Komunikasi Publik</SelectItem>
                <SelectItem value="Bidang Persandian dan Statistik">Bidang Persandian dan Statistik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Pegawai</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeModal;