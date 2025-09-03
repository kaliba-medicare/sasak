import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface EmployeeModalProps {
  employee?: any;
  onSuccess: () => void;
  children: React.ReactNode;
}

const EmployeeModal = ({ employee, onSuccess, children }: EmployeeModalProps) => {
  const [name, setName] = useState(employee?.name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState(employee?.position || "");
  const [department, setDepartment] = useState(employee?.department || "");
  const [role, setRole] = useState(employee?.role || "employee");
  const [employeeId, setEmployeeId] = useState(employee?.employee_id || "");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
        const { error } = await supabase.from("profiles").update({
          name,
          employee_id: employeeId,
          position,
          department,
          role,
        }).eq("id", employee.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data pegawai berhasil diperbarui" });
      } else {
        // Create new employee with admin service role
        const finalEmployeeId = employeeId || generateEmployeeId();
        
        // First create the user account
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: name,
            employee_id: finalEmployeeId,
            position: position,
            department: department,
            role: role
          }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          // Then create/update the profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              user_id: authData.user.id,
              name: name,
              employee_id: finalEmployeeId,
              position: position,
              department: department,
              role: role,
              email: email
            });
          
          if (profileError) throw profileError;
        }
        
        toast({ title: "Berhasil", description: "Pegawai baru berhasil ditambahkan" });
      }
      
      // Reset form
      if (!employee) {
        setName("");
        setEmail("");
        setPassword("");
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
            <Label htmlFor="position">Posisi</Label>
            <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Departemen</Label>
            <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
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