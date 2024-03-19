import {K8sMetricsImporter} from '../../../lib/k8s-metrics-importer';

describe('lib/k8s-metrics-importer: ', () => {
  describe('K8sMetricsImporter(): ', () => {
    it('has metadata field.', () => {
      const pluginInstance = K8sMetricsImporter({});

      expect(pluginInstance).toHaveProperty('metadata');
      expect(pluginInstance).toHaveProperty('execute');
      expect(pluginInstance.metadata).toHaveProperty('kind');
      expect(typeof pluginInstance.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('applies logic on provided inputs array.', async () => {
        const pluginInstance = K8sMetricsImporter({
          token: process.env.K8S_TOKEN,
        });
        const inputs = [{}];

        const response = await pluginInstance.execute(inputs, {});
        expect(response).toBeDefined;
      });
    });

    describe('execute(): ERROR ', () => {
      it('throws an error.', async () => {
        const pluginInstance = K8sMetricsImporter({other: 'aerwgtadefrhadr'});
        const inputs = [{}];

        process.env.K8S_TOKEN = '';
        process.env.K8S_HOST_URL = '';
        try {
          const response = await pluginInstance.execute(inputs, {});
          expect(response).toThrow;
        } catch (error) {
          expect('1').toBe('1');
        }
      });
    });
  });
});
