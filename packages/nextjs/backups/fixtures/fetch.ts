import nodeFetch from 'node-fetch';

const isEdgeRuntime =
  // @ts-ignore
  typeof EdgeRuntime !== 'undefined';

export const mockFetch = () => {
  if (isEdgeRuntime) {
    jest.spyOn(globalThis, 'fetch').mockImplementation((...args: any[]) =>
      (nodeFetch as any)(...args).then(async (res: any) => {
        const res2 = new Response(await res.text(), {
          headers: Object.fromEntries(res.headers.entries()),
          status: res.status,
        });
        Object.defineProperty(res2, 'url', {value: args[0]});
        return res2;
      }),
    );
  }
};
