export const mockEmployees = [
  { empno: 7369, ename: 'SMITH', job: 'CLERK', mgr: 7902, hiredate: '1980-12-17', sal: 800, comm: null, deptno: 20 },
  { empno: 7499, ename: 'ALLEN', job: 'SALESMAN', mgr: 7698, hiredate: '1981-02-20', sal: 1600, comm: 300, deptno: 30 },
  { empno: 7521, ename: 'WARD', job: 'SALESMAN', mgr: 7698, hiredate: '1981-02-22', sal: 1250, comm: 500, deptno: 30 },
  { empno: 7566, ename: 'JONES', job: 'MANAGER', mgr: 7839, hiredate: '1981-04-02', sal: 2975, comm: null, deptno: 20 },
  { empno: 7654, ename: 'MARTIN', job: 'SALESMAN', mgr: 7698, hiredate: '1981-09-28', sal: 1250, comm: 1400, deptno: 30 },
  { empno: 7698, ename: 'BLAKE', job: 'MANAGER', mgr: 7839, hiredate: '1981-05-01', sal: 2850, comm: null, deptno: 30 },
  { empno: 7782, ename: 'CLARK', job: 'MANAGER', mgr: 7839, hiredate: '1981-06-09', sal: 2450, comm: null, deptno: 10 },
  { empno: 7788, ename: 'SCOTT', job: 'ANALYST', mgr: 7566, hiredate: '1982-12-09', sal: 3000, comm: null, deptno: 20 },
  { empno: 7839, ename: 'KING', job: 'PRESIDENT', mgr: null, hiredate: '1981-11-17', sal: 5000, comm: null, deptno: 10 },
  { empno: 7844, ename: 'TURNER', job: 'SALESMAN', mgr: 7698, hiredate: '1981-09-08', sal: 1500, comm: 0, deptno: 30 },
  { empno: 7876, ename: 'ADAMS', job: 'CLERK', mgr: 7788, hiredate: '1983-01-12', sal: 1100, comm: null, deptno: 20 },
  { empno: 7900, ename: 'JAMES', job: 'CLERK', mgr: 7698, hiredate: '1981-12-03', sal: 950, comm: null, deptno: 30 },
  { empno: 7902, ename: 'FORD', job: 'ANALYST', mgr: 7566, hiredate: '1981-12-03', sal: 3000, comm: null, deptno: 20 },
];

export const mockDepartments = [
  { deptno: 10, dname: 'ACCOUNTING', loc: 'NEW YORK' },
  { deptno: 20, dname: 'RESEARCH', loc: 'DALLAS' },
  { deptno: 30, dname: 'SALES', loc: 'CHICAGO' },
  { deptno: 40, dname: 'OPERATIONS', loc: 'BOSTON' },
];

export const mockSalgrade = [
  { grade: 1, losal: 700, hisal: 1200 },
  { grade: 2, losal: 1201, hisal: 1400 },
  { grade: 3, losal: 1401, hisal: 2000 },
  { grade: 4, losal: 2001, hisal: 3000 },
  { grade: 5, losal: 3001, hisal: 9999 },
];

// Simple SQL parser for mock data
export function parseMockQuery(sql: string): { 
  table: string | null; 
  columns: string[] | '*'; 
  where: Record<string, any>;
  orderBy: { column: string; direction: 'ASC' | 'DESC' } | null;
} {
  const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase();
  
  // Extract table name
  const fromMatch = normalized.match(/FROM\s+(\w+)/i);
  const table = fromMatch ? fromMatch[1].toLowerCase() : null;
  
  // Extract columns
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
  const columnsStr = selectMatch ? selectMatch[1].trim() : '*';
  const columns = columnsStr === '*' ? '*' : columnsStr.split(',').map(c => c.trim().toLowerCase());
  
  // Extract WHERE conditions (simplified)
  const where: Record<string, any> = {};
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|;|$)/i);
  if (whereMatch) {
    const conditions = whereMatch[1].split(/\s+AND\s+/i);
    conditions.forEach(cond => {
      const eqMatch = cond.match(/(\w+)\s*=\s*(\d+|'[^']*')/i);
      if (eqMatch) {
        const col = eqMatch[1].toLowerCase();
        let val: any = eqMatch[2];
        if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        } else {
          val = parseInt(val, 10);
        }
        where[col] = val;
      }
    });
  }
  
  // Extract ORDER BY
  let orderBy: { column: string; direction: 'ASC' | 'DESC' } | null = null;
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    orderBy = {
      column: orderMatch[1].toLowerCase(),
      direction: (orderMatch[2]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
    };
  }
  
  return { table, columns, where, orderBy };
}

export function getMockData(table: string): Record<string, any>[] {
  switch (table.toLowerCase()) {
    case 'emp':
    case 'employee':
    case 'employees':
      return mockEmployees;
    case 'dept':
    case 'department':
    case 'departments':
      return mockDepartments;
    case 'salgrade':
      return mockSalgrade;
    default:
      return [];
  }
}
