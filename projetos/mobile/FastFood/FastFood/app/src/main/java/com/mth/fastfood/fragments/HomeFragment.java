package com.mth.fastfood.fragments;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.Toast;
import androidx.annotation.CallSuper;
import androidx.annotation.MainThread;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.mth.fastfood.R;
import com.mth.fastfood.SingleActivity;
import com.mth.fastfood.adapter.RecyclerViewAdapter;
import com.mth.fastfood.inter.OnItemClickListener;
import com.mth.fastfood.utils.ProductArray;
import java.util.ArrayList;
import java.util.zip.Inflater;
import com.mth.fastfood.CategoryActivity;

public class HomeFragment extends Fragment {
    
    private Context mContext;
    private View mView;
    
    private LinearLayout category_hamburge_1;
    private LinearLayout category_hamburge_2;
    private LinearLayout category_refri;
    private LinearLayout category_pizza;
    private LinearLayout category_variados;
    
    private RecyclerView mRecycler;
    private RecyclerViewAdapter mAdapter;
    private LinearLayoutManager llm;
    private ArrayList<ProductArray> array_list = new ArrayList<ProductArray>();
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup parent, Bundle bundle) {
        
        mView = inflater.inflate(R.layout.fragment_home, parent, false);
        mContext = mView.getContext();
        
        return mView;
    }
    
    @Override
    @Deprecated
    @MainThread
    @CallSuper
    public void onActivityCreated(Bundle arg0) {
        super.onActivityCreated(arg0);
        
        main();
        logic();
        
    }
    
    public void main() {
        category_hamburge_1 = (LinearLayout) mView.findViewById(R.id.category_hambuger_1);
        category_hamburge_2 = (LinearLayout) mView.findViewById(R.id.category_hambuger_2);
        category_refri = (LinearLayout) mView.findViewById(R.id.category_refri);
        category_pizza = (LinearLayout) mView.findViewById(R.id.category_pizza);
        category_variados = (LinearLayout) mView.findViewById(R.id.category_variados);
        mRecycler = (RecyclerView) mView.findViewById(R.id.recycler_view);
        llm = new LinearLayoutManager(mContext);
    }
    
    public void logic() {
        
        mRecycler.setHasFixedSize(true);
        mRecycler.setLayoutManager(llm);
        
        int img[] = {
            R.drawable.hamburguer_01,
            R.drawable.hamburguer_02,
            R.drawable.hamburguer_03,
            R.drawable.hamburguer_04,
            R.drawable.hamburguer_05,
            R.drawable.hamburguer_06,
            R.drawable.hamburguer_07,
            R.drawable.hamburguer_08,
            R.drawable.hamburguer_09
        };
        
        for (int i = 0; img.length > i; i++) {
            ProductArray array = new ProductArray();
            array.setImage(img[i]);
            array.setTitle("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
            array.setAdrress("Endereço");
            array.setCampanyName("Empresa nome");
            array.setCampanyHour("Empresa Horário");
            
            array_list.add(array);
        }
        
        mAdapter = new RecyclerViewAdapter(mContext, R.layout.content_home_cardview, array_list);
        mRecycler.setAdapter(mAdapter);
        
        mAdapter.setOnItemClickListener(new OnItemClickListener() {
            @Override
            public void onClick(int position) {
                    Intent intent = new Intent(mContext, SingleActivity.class);
                    intent.putExtra("imageID", array_list.get(position).getImage());
                    startActivity(intent);
            }
        });
        
        category_hamburge_1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(mContext, CategoryActivity.class);
                intent.putExtra("category_name", "Hambúrguer 1");
                startActivity(intent);
                //overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
            }
        });
        
        category_hamburge_2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(mContext, CategoryActivity.class);
                intent.putExtra("category_name", "Hambúrguer 2");
                startActivity(intent);
            }
        });
        
        category_refri.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(mContext, CategoryActivity.class);
                intent.putExtra("category_name", "Refrigerante");
                startActivity(intent);
            }
        });
        
        category_pizza.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(mContext, CategoryActivity.class);
                intent.putExtra("category_name", "Pizza");
                startActivity(intent);
            }
        });
        
        category_variados.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(mContext, CategoryActivity.class);
                intent.putExtra("category_name", "Variados");
                startActivity(intent);
            }
        });
        
    }
    
    public void alerta(String string) {
        Toast.makeText(mContext, string, Toast.LENGTH_SHORT).show();
    }
    
}
