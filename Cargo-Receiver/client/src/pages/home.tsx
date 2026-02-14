import { useState, useRef } from "react";
import { Check, Box, Truck, Package, FileText, AlertTriangle, User, PenTool, ArrowLeft, Edit3, Save, Camera, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface CargoItem {
  id: string;
  product: string;
  scc: string;
  sku: string;
  expiry: string;
  batch: string;
  expectedBoxes: number;
  confirmedBoxes: number;
  finalBoxes: number; // Value accepted in the system
  status: 'pending' | 'ok' | 'discrepancy';
  damagePhoto?: string;
  damageObservation?: string;
}

interface RO {
  id: string;
  product: string;
  scc: string;
  sku: string;
  expiry: string;
  batch: string;
  expected: number;
  confirmed: number;
  difference: number;
  timestamp: string;
}

const initialProducts = [
  { product: "Snickers White", sku: "606ACGUA11", pallets: 6, expiry: "23/12/2026", boxes: 55 },
  { product: "Snickers Pé de Moleque", sku: "606FAGUA06", pallets: 4, expiry: "01/02/2027", boxes: 120 },
  { product: "M&M's Choco", sku: "606HKGUA01", pallets: 8, expiry: "01/01/2027", boxes: 44 },
  { product: "M&M's ao Leite", sku: "606AVGUA09", pallets: 6, expiry: "28/12/2026", boxes: 120 },
  { product: "Twix", sku: "TWX-MOCK-99", pallets: 4, expiry: "15/06/2027", boxes: 120 },
];

const generateMockItems = (): CargoItem[] => {
  let items: CargoItem[] = [];
  initialProducts.forEach((p, pIdx) => {
    for (let i = 1; i <= p.pallets; i++) {
      items.push({
        id: `${pIdx}-${i}`,
        product: p.product,
        scc: `378${Math.floor(Math.random() * 1000000000)}`,
        sku: p.sku,
        expiry: p.expiry,
        batch: `L${Math.floor(10000 + Math.random() * 900000)}`,
        expectedBoxes: p.boxes,
        confirmedBoxes: p.boxes,
        finalBoxes: p.boxes,
        status: 'pending',
      });
    }
  });
  return items;
};

export default function Home() {
  const [items, setItems] = useState<CargoItem[]>(generateMockItems());
  const [view, setView] = useState<'receiving' | 'summary'>('receiving');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [activeDamageId, setActiveDamageId] = useState<string | null>(null);
  const [tempObs, setTempObs] = useState("");

  const handleUpdate = (id: string, field: keyof CargoItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'confirmedBoxes' || field === 'expectedBoxes') {
          updated.status = updated.confirmedBoxes === updated.expectedBoxes ? 'ok' : 'discrepancy';
          // Se conferido < esperado, o valor final aceito no sistema é o esperado
          updated.finalBoxes = updated.confirmedBoxes < updated.expectedBoxes ? updated.expectedBoxes : updated.confirmedBoxes;
        }
        return updated;
      }
      return item;
    }));
  };

  const toggleCheck = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newStatus = item.status === 'pending' 
          ? (item.confirmedBoxes === item.expectedBoxes ? 'ok' : 'discrepancy')
          : 'pending';
        return { ...item, status: newStatus as any };
      }
      return item;
    }));
  };

  const handleRegisterDamage = (id: string) => {
    const item = items.find(i => i.id === id);
    setActiveDamageId(id);
    setTempObs(item?.damageObservation || "");
    setDamageDialogOpen(true);
  };

  const saveDamage = () => {
    if (activeDamageId) {
      setItems(prev => prev.map(item => 
        item.id === activeDamageId 
          ? { ...item, damagePhoto: "mock-photo-uri", damageObservation: tempObs } 
          : item
      ));
    }
    setDamageDialogOpen(false);
  };

  const confirmedCount = items.filter(i => i.status !== 'pending').length;
  const progress = (confirmedCount / items.length) * 100;
  
  const ros: RO[] = items
    .filter(i => i.status === 'discrepancy' && i.confirmedBoxes < i.expectedBoxes)
    .map(i => ({
      id: `RO-${i.id}`,
      product: i.product,
      scc: i.scc,
      sku: i.sku,
      expiry: i.expiry,
      batch: i.batch,
      expected: i.expectedBoxes,
      confirmed: i.confirmedBoxes,
      difference: i.confirmedBoxes - i.expectedBoxes,
      timestamp: new Date().toLocaleString()
    }));

  if (view === 'summary') {
    return <SummaryView items={items} ros={ros} onBack={() => setView('receiving')} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Paperless Logistics</h1>
              <p className="text-slate-500 text-sm font-medium">Segunda Conferência • Evidências & Auditoria</p>
            </div>
          </div>
          <Card className="flex items-center gap-6 px-6 py-3 border-none shadow-sm bg-white rounded-xl">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conferência</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black">{confirmedCount}/{items.length}</span>
                <Progress value={progress} className="w-24 h-2" />
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Divergências/RO</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-xl font-black", ros.length > 0 ? "text-amber-500" : "text-slate-900")}>{ros.length}</span>
                {ros.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
          </Card>
        </header>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-900 text-white">
                <TableRow className="hover:bg-slate-900 border-none">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="text-white font-bold py-4">Produto</TableHead>
                  <TableHead className="text-white font-bold">SCC</TableHead>
                  <TableHead className="text-white font-bold">SKU</TableHead>
                  <TableHead className="text-white font-bold">Validade</TableHead>
                  <TableHead className="text-white font-bold">Lote</TableHead>
                  <TableHead className="text-white font-bold text-center">Esperado</TableHead>
                  <TableHead className="text-white font-bold text-center">Conferido</TableHead>
                  <TableHead className="text-white font-bold text-center">Final (Sist.)</TableHead>
                  <TableHead className="text-white font-bold text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow 
                    key={item.id}
                    className={cn(
                      "group transition-all duration-200 border-b border-slate-50",
                      item.damagePhoto && "bg-orange-50/50",
                      item.status === 'ok' && !item.damagePhoto && "bg-green-50/50",
                      item.status === 'discrepancy' && !item.damagePhoto && "bg-red-50/50"
                    )}
                  >
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={item.status !== 'pending'}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="w-5 h-5 border-2"
                      />
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 min-w-[180px]">{item.product}</TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input value={item.scc} onChange={(e) => handleUpdate(item.id, 'scc', e.target.value)} className="h-8 font-mono text-xs w-32" />
                      ) : (
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{item.scc}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input value={item.sku} onChange={(e) => handleUpdate(item.id, 'sku', e.target.value)} className="h-8 font-mono text-xs w-32" />
                      ) : (
                        <span className="font-mono text-xs font-bold text-slate-700">{item.sku}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input value={item.expiry} onChange={(e) => handleUpdate(item.id, 'expiry', e.target.value)} className="h-8 text-xs w-24" />
                      ) : (
                        <span className="text-xs font-medium text-slate-600">{item.expiry}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input value={item.batch} onChange={(e) => handleUpdate(item.id, 'batch', e.target.value)} className="h-8 text-xs w-24" />
                      ) : (
                        <span className="text-xs font-medium text-slate-600">{item.batch}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono font-bold text-slate-400">{item.expectedBoxes}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === item.id ? (
                        <Input 
                          type="number" 
                          value={item.confirmedBoxes} 
                          onChange={(e) => handleUpdate(item.id, 'confirmedBoxes', parseInt(e.target.value) || 0)} 
                          className="h-8 w-16 text-center mx-auto"
                        />
                      ) : (
                        <span className={cn("font-mono font-black", item.confirmedBoxes !== item.expectedBoxes ? "text-red-600" : "text-slate-900")}>
                          {item.confirmedBoxes}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                       <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 rounded">{item.finalBoxes}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
                        item.damagePhoto ? "bg-orange-100 text-orange-700" : (
                          item.status === 'ok' && "bg-green-100 text-green-700" ||
                          item.status === 'discrepancy' && "bg-red-100 text-red-700" ||
                          item.status === 'pending' && "bg-slate-100 text-slate-500"
                        )
                      )}>
                        {item.damagePhoto ? "Avaria" : (item.status === 'pending' ? 'Pendente' : item.status === 'ok' ? 'OK' : 'Divergência')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                          className="h-8 w-8 p-0"
                        >
                          {editingId === item.id ? <Save className="w-4 h-4 text-blue-600" /> : <Edit3 className="w-4 h-4 text-slate-400" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegisterDamage(item.id)}
                          className={cn("h-8 w-8 p-0", item.damagePhoto ? "text-orange-500 bg-orange-50" : "text-slate-400")}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <footer className="flex justify-end gap-4">
          <Button 
            onClick={() => setView('summary')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black px-12 h-14 text-lg rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            Finalizar Recebimento
          </Button>
        </footer>
      </div>

      <Dialog open={damageDialogOpen} onOpenChange={setDamageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" /> Registrar Avaria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="h-48 bg-slate-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-colors cursor-pointer">
                <Camera className="w-10 h-10 text-slate-300 group-hover:text-blue-400 mb-2" />
                <p className="text-xs font-bold text-slate-400 group-hover:text-blue-500 uppercase">Tirar Foto / Anexar</p>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Observações</label>
                <Textarea 
                  placeholder="Ex: Caixa rasgada, pallet quebrado..." 
                  value={tempObs}
                  onChange={(e) => setTempObs(e.target.value)}
                  className="resize-none"
                />
             </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDamageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveDamage} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">Salvar Evidência</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryView({ items, ros, onBack }: { items: CargoItem[], ros: RO[], onBack: () => void }) {
  const [signatures, setSignatures] = useState({ checker: false, supervisor: false, leader: false });
  const damagedItems = items.filter(i => i.damagePhoto);

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-slate-500 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar para checklist
        </Button>

        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Relatório Final de Recebimento</h2>
          <div className="flex justify-center gap-4">
             <span className="px-4 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 tracking-tight">MANIFESTO: #MNS-2026-0209</span>
             <span className="px-4 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500 tracking-tight">{new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Paletes</p>
             <p className="text-4xl font-black text-slate-900">{items.length}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Caixas Sist.</p>
             <p className="text-4xl font-black text-blue-600">{items.reduce((a, b) => a + b.finalBoxes, 0)}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Divergências</p>
             <p className={cn("text-4xl font-black", ros.length > 0 ? "text-amber-500" : "text-slate-900")}>{ros.length}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Avarias</p>
             <p className={cn("text-4xl font-black", damagedItems.length > 0 ? "text-orange-500" : "text-slate-900")}>{damagedItems.length}</p>
          </div>
        </div>

        {damagedItems.length > 0 && (
           <div className="space-y-6">
              <h3 className="text-xl font-black text-orange-600 flex items-center gap-2 uppercase tracking-tight">
                <Camera className="w-6 h-6" /> Registro de Avarias Identificadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {damagedItems.map(item => (
                   <Card key={item.id} className="border-orange-100 bg-orange-50/20 p-4 rounded-2xl flex gap-4 items-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500">
                         <ImageIcon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-slate-900">{item.product}</p>
                         <p className="text-[10px] text-slate-500 uppercase">{item.sku} • {item.scc}</p>
                         <p className="text-xs font-medium text-orange-700 mt-1 italic">"{item.damageObservation || "Sem observação"}"</p>
                      </div>
                   </Card>
                 ))}
              </div>
           </div>
        )}

        {ros.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-amber-600 flex items-center gap-2 uppercase tracking-tight">
              <AlertTriangle className="w-6 h-6" /> Registros de Ocorrência (RO) Gerados
            </h3>
            <div className="grid gap-4">
              {ros.map(ro => (
                <Card key={ro.id} className="border-2 border-amber-100 bg-amber-50/30 p-6 rounded-2xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Produto</p>
                      <p className="font-bold text-slate-900">{ro.product}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Diferença</p>
                      <p className="font-black text-amber-600 text-xl">{ro.difference > 0 ? `+${ro.difference}` : ro.difference} caixas</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Fábrica vs Físico</p>
                      <p className="font-bold text-slate-700">{ro.expected} / {ro.confirmed}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Identificação</p>
                      <p className="text-xs font-mono text-slate-500 uppercase">{ro.sku} • {ro.scc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t-2 border-slate-100">
          <SignatureArea title="Conferente" signed={signatures.checker} onSign={() => setSignatures(s => ({...s, checker: true}))} />
          <SignatureArea title="Supervisor" signed={signatures.supervisor} onSign={() => setSignatures(s => ({...s, supervisor: true}))} />
          <SignatureArea title="Líder de Expedição" signed={signatures.leader} onSign={() => setSignatures(s => ({...s, leader: true}))} />
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
           <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-20 rounded-2xl text-2xl font-black shadow-2xl transition-transform active:scale-95">
             CONSOLIDAR RECEBIMENTO
           </Button>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Este sistema é uma evidência operacional complementar ao Generix</p>
        </div>
      </div>
    </div>
  );
}

function SignatureArea({ title, signed, onSign }: { title: string, signed: boolean, onSign: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-black text-slate-500 uppercase text-center tracking-widest">{title}</p>
      <div 
        onClick={onSign}
        className={cn(
          "h-48 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all",
          signed ? "bg-green-50 border-green-500 border-solid" : "hover:bg-slate-50 hover:border-slate-400 border-slate-200"
        )}
      >
        {signed ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="bg-green-500 text-white p-3 rounded-full mb-3 mx-auto w-fit shadow-lg shadow-green-100">
              <Check className="w-8 h-8" />
            </div>
            <p className="text-xs font-black text-green-700 uppercase tracking-widest">Assinado Digitalmente</p>
            <p className="text-[10px] text-green-600/60 font-mono mt-1">{new Date().toLocaleTimeString('pt-BR')}</p>
          </motion.div>
        ) : (
          <div className="text-center text-slate-300">
            <PenTool className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">Clique para assinar</p>
          </div>
        )}
      </div>
    </div>
  );
}
